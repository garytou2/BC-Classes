import React, { Component } from "react";
import { Avatar } from "antd";
import Firebase from "../utils/Firebase";

class ProfilePicture extends Component {
	constructor() {
		super();
		this.state = { photoURL: "" };
	}

	componentDidMount() {
		//TODO: need to remove listener on dismount
		Firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this.setState(user.photoURL);
				var uid = user.uid;
				Firebase.database()
					.ref("/users/" + uid + "/photoURL/")
					.on("value")
					.then(function (snapshot) {
						this.setState({ photoURL: snapshot.val() });
					});
			} else {
				this.setState({ photoURL: "https://www.gravatar.com/avatar/?d=mp" });
			}
		});
	}

	render() {
		return (
			<Avatar
				className="profilePicture"
				shape="circle"
				alt="Profile Picture"
				src={this.state.photoURL}
			></Avatar>
		);
	}
}

export default ProfilePicture;